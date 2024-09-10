// Helper function to get the Monday of the week containing a given date
function getWeekStartDate(date) {
  const day = date.getDay();
  const diff = (day === 0 ? 6 : day - 1); // Adjust for Sunday as 0 and Monday as 1
  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  return monday;
}

// Function to generate the Excel template and download it
function generateTemplate() {
  const dobInput = document.getElementById('dob').value;
  if (!dobInput) {
    alert('Please enter a valid date of birth');
    return;
  }

  const dob = new Date(dobInput);
  const data = [];

  let currentDate = getWeekStartDate(dob); // Start with the week of birth
  let currentYear = dob.getFullYear();
  let age = 0;

  // Generate 80 years' worth of weeks
  while (age <= 90) {
    const dateStr = currentDate.toISOString().split('T')[0]; // Convert date to 'YYYY-MM-DD'
    let event = '';
    let extraDetails = '';

    // Add event for birth
    if (age === 0 && currentDate.getTime() === getWeekStartDate(dob).getTime()) {
      event = 'You are born!';
      extraDetails = `In ${dob.toISOString().split('T')[0]} you were brought to this world. Congratulations!`;
    } else {
      // Add event for birthdays
      const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
      if (
        currentDate.getTime() <= birthdayThisYear.getTime() &&
        new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).getTime() > birthdayThisYear.getTime()
      ) {
        if (age === 80) {
          event = "Your theoretical life expiraxy date";
        } else {
          event = `${age} in ${currentYear}`;
          extraDetails = "According to statistics, if you don't have any accidental death, you have more or less until here to live. Progress bar of your life is calculated based on this date"
        }
      }
    }

    // Push the week data into array
    data.push([dateStr, event, extraDetails]);

    // Move to the next week (7 days later)
    currentDate.setDate(currentDate.getDate() + 7);

    // Update the year and age if we move to the next year
    if (currentDate.getFullYear() > currentYear) {
      age++;
      currentYear = currentDate.getFullYear();
    }
  }

  // Create worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet([['Date', 'Event', 'Extra_details'], ...data]);
  // Set column widths (in character width units)
  worksheet['!cols'] = [
    { wch: 15 }, // Date column width (15 characters wide)
    { wch: 30 }, // Event column width (30 characters wide)
    { wch: 50 }  // Extra_details column width (50 characters wide)
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Life Weeks');

  // Generate the Excel file and download
  XLSX.writeFile(workbook, 'Life_Weeks_Template.xlsx');
}

document.getElementById('upload').addEventListener('change', handleFileUpload);
const modal = document.getElementById('event-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const closeModal = document.getElementsByClassName('close')[0];

// Close modal when clicked outside
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Close modal when 'x' is clicked
closeModal.onclick = function () {
  modal.style.display = "none";
};

function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    generateCalendar(jsonData);
  };

  reader.readAsArrayBuffer(file);
}

// Function to calculate the start and end date of the week
function getWeekRange(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // Get the current day of the week (0 = Sunday, 6 = Saturday)

  const startDate = new Date(date);
  startDate.setDate(date.getDate() - dayOfWeek + 1); // Set to Monday

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Set to Sunday

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return {
    start: startDate.toLocaleDateString(undefined, options),
    end: endDate.toLocaleDateString(undefined, options)
  };
}

function generateCalendar(data) {
  const calendarContainer = document.getElementById('calendar-container');
  calendarContainer.innerHTML = '';  // Clear any existing squares
  const currentDate = new Date();  // Get the current date

  data.forEach(row => {
    const square = document.createElement('div');

    // Get the start and end dates of the week
    const weekRange = getWeekRange(row.Date);
    const startOfWeek = new Date(weekRange.start);
    const endOfWeek = new Date(weekRange.end);

    // Check if the current date is within this week
    if (currentDate >= startOfWeek && currentDate <= endOfWeek) {
      square.classList.add('current');  // Add current week class
    } else if (currentDate < startOfWeek) {
      square.classList.add('future');  // Add future week class
    }

    if (row.Event) {
      // Rectangle for event
      square.classList.add('rectangle');
      square.innerHTML = row.Event;

      // Make square clickable for modal if an event exists
      square.addEventListener('click', () => {
        // Update modal with week range and event details
        const modalTitleText = `${weekRange.start} - ${weekRange.end}`;
        const modalContent = `<h5>${row.Event}</h5><p>${row.Extra_details}</p>`;
        openModal(modalTitleText, modalContent);
      });
    } else {
      // Square when event is empty
      square.classList.add('square');
    }

    // Custom tooltip for week range
    const tooltip = document.createElement('div');
    tooltip.classList.add('custom-tooltip');
    tooltip.innerHTML = `Week: ${weekRange.start} - ${weekRange.end}`;

    // Show custom tooltip on hover
    square.addEventListener('mouseover', () => {
      calendarContainer.appendChild(tooltip);
      tooltip.style.display = 'block';
    });

    square.addEventListener('mousemove', (e) => {
      tooltip.style.top = e.pageY + 10 + 'px';
      tooltip.style.left = e.pageX + 10 + 'px';
    });

    square.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      calendarContainer.removeChild(tooltip);
    });

    // Append the square/rectangle to the main calendar container
    calendarContainer.appendChild(square);
  });

  generateProgressBar(data[0].Date); // populate progress bar
}




function openModal(eventTitle, eventContent) {
  modalTitle.innerText = eventTitle;
  modalText.innerHTML = eventContent; // Use innerHTML to render the content with <h5> and <p>
  modal.style.display = 'block';
}

// Function to calculate and display the percentage of life lived
function generateProgressBar(dob) {
  const currentDate = new Date();
  const birthDate = new Date(dob);
  const age80Date = new Date(birthDate);
  age80Date.setFullYear(birthDate.getFullYear() + 80);

  // Calculate total days from birth to turning 80
  const totalDays = Math.floor((age80Date - birthDate) / (1000 * 60 * 60 * 24));

  // Calculate days lived from birth to current date
  const daysLived = Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24));

  // Calculate the percentage of days lived
  const percentageLived = Math.min((daysLived / totalDays) * 100, 100);

  // Create the progress bar HTML
  const progressBarContainer = document.getElementById('progress-bar-container');
  progressBarContainer.innerHTML = ''; // Clear existing content

  const progressBar = document.createElement('div');
  progressBar.classList.add('progress-bar');
  progressBar.style.width = `${percentageLived}%`;

  // Add text inside the progress bar
  const progressText = document.createElement('span');
  progressText.classList.add('progress-text');
  progressText.textContent = `${Math.round(percentageLived)}% lived`;

  progressBar.appendChild(progressText);
  progressBarContainer.appendChild(progressBar);
}
