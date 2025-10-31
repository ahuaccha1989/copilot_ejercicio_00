document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic activity info
        const title = document.createElement('h4');
        title.textContent = name;

        const desc = document.createElement('p');
        desc.textContent = details.description;

        const scheduleP = document.createElement('p');
        scheduleP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availP = document.createElement('p');
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(scheduleP);
        activityCard.appendChild(availP);

        // Participants (only show if there are participants)
        if (details.participants && details.participants.length > 0) {
          const participantsDiv = document.createElement('div');
          participantsDiv.className = 'participants';

          const strong = document.createElement('strong');
          strong.textContent = 'Participants:';
          participantsDiv.appendChild(strong);

          const ul = document.createElement('ul');

          details.participants.forEach(participant => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.textContent = participant;

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Eliminar';
            delBtn.dataset.activity = name;
            delBtn.dataset.email = participant;

            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
          activityCard.appendChild(participantsDiv);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so participants list and availability update
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle delete participant clicks using event delegation
  activitiesList.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('delete-btn')) {
      const email = target.dataset.email;
      const activity = target.dataset.activity;

      if (!confirm(`Eliminar ${email} de ${activity}?`)) return;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );

        const result = await response.json();

        if (response.ok) {
          messageDiv.textContent = result.message || 'Participant removed';
          messageDiv.className = 'success';
          messageDiv.classList.remove('hidden');

          // Refresh activities to reflect changes and hide participants section if empty
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || 'Failed to remove participant';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
        }

        // auto-hide message
        setTimeout(() => {
          messageDiv.classList.add('hidden');
        }, 3000);
      } catch (error) {
        messageDiv.textContent = 'Failed to remove participant. Please try again.';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
        console.error('Error removing participant:', error);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
